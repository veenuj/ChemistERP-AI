package com.quickrx.erp.billing;

import com.quickrx.erp.inventory.Medicine;
import com.quickrx.erp.inventory.MedicineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final SaleRepository saleRepository;
    private final MedicineRepository medicineRepository;

    @Transactional // Ensures that if stock deduction fails, the whole sale is rolled back
    public Sale processSale(Sale requestSale) {
        double totalAmount = 0.0;

        // Process each item in the cart
        for (SaleItem item : requestSale.getItems()) {
            // Fetch fresh medicine data from DB to avoid price/stock mismatch
            Medicine medicine = medicineRepository.findById(item.getMedicine().getId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found!"));

            if (medicine.getStockLevel() < item.getQuantity()) {
                throw new RuntimeException("Insufficient stock for: " + medicine.getName());
            }

            // Deduct stock
            medicine.setStockLevel(medicine.getStockLevel() - item.getQuantity());
            medicineRepository.save(medicine);

            // Set secure pricing (don't trust frontend prices)
            item.setUnitPrice(medicine.getPrice());
            item.setSubTotal(medicine.getPrice() * item.getQuantity());
            item.setSale(requestSale); // Link item back to the parent sale

            totalAmount += item.getSubTotal();
        }

        requestSale.setTotalAmount(totalAmount);
        requestSale.setSaleDate(LocalDateTime.now());

        return saleRepository.save(requestSale);
    }
}