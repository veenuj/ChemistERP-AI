package com.quickrx.erp.billing;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sales", indexes = {
    @Index(name = "idx_sales_date", columnList = "sale_date"),
    @Index(name = "idx_sales_customer", columnList = "customer_phone")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sale_date", nullable = false)
    private LocalDateTime saleDate;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(name = "customer_phone")
    private String customerPhone; // Optional, for sending digital receipts

    // One sale can have many items. Cascade ensures saving the sale saves the items.
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "sale", fetch = FetchType.LAZY)
    private List<SaleItem> items;
}