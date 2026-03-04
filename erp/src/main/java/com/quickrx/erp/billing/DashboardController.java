package com.quickrx.erp.billing;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity; 
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DashboardController {

    private final JdbcTemplate jdbcTemplate; 

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        // 1. Basic Stats
        Double totalRevenue = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE sale_date >= CURRENT_DATE", Double.class);
        
        Integer lowStockCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM medicines WHERE stock_level < 10", Integer.class);

        // 2. Analytics (Top Sellers)
        List<Map<String, Object>> topSellers = jdbcTemplate.queryForList(
            "SELECT m.name, SUM(si.quantity) as total_sold " +
            "FROM sale_items si JOIN medicines m ON si.medicine_id = m.id " +
            "GROUP BY m.name ORDER BY total_sold DESC LIMIT 5");

        // 3. NEW: Expiry Alerts (30 Days)
        List<Map<String, Object>> expiryAlerts = jdbcTemplate.queryForList(
            "SELECT name, expiry_date, stock_level FROM medicines " +
            "WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days' " +
            "AND expiry_date >= CURRENT_DATE ORDER BY expiry_date ASC"
        );

        // 4. NEW: Critical Stock (Less than 5)
        List<Map<String, Object>> criticalStock = jdbcTemplate.queryForList(
            "SELECT name, stock_level FROM medicines WHERE stock_level < 5 ORDER BY stock_level ASC"
        );

        // 5. Final Combined Response
        return ResponseEntity.ok(Map.of(
            "revenue", totalRevenue,
            "lowStock", lowStockCount,
            "topSellers", topSellers,
            "expiryAlerts", expiryAlerts,
            "criticalStock", criticalStock
        ));
    }
}