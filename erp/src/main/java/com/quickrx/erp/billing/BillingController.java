package com.quickrx.erp.billing;

import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate; // ADDED THIS
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/billing")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;
    private final JdbcTemplate jdbcTemplate; // ADDED THIS - Spring will inject this automatically

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Sale sale) {
        try {
            Sale completedSale = billingService.processSale(sale);
            return new ResponseEntity<>(completedSale, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getTransactionHistory() {
        // We use "as" to ensure the keys match our React Transaction interface
        String sql = "SELECT id as id, " +
                    "total_amount as total_amount, " +
                    "sale_date as sale_date, " +
                    "customer_phone as customer_phone " +
                    "FROM sales ORDER BY sale_date DESC LIMIT 50";
        
        List<Map<String, Object>> history = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<Map<String, Object>> getTransactionDetails(@PathVariable Long id) {
        List<Map<String, Object>> items = jdbcTemplate.queryForList(
            "SELECT m.name, si.quantity, m.price, m.generic_name " +
            "FROM sale_items si JOIN medicines m ON si.medicine_id = m.id " +
            "WHERE si.sale_id = ?", id
        );
        return ResponseEntity.ok(Map.of("items", items));
    }
}