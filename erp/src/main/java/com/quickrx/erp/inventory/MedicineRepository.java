package com.quickrx.erp.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    
    // For lightning-fast POS barcode scanners
    Optional<Medicine> findByBarcode(String barcode);
    
    // For fast search bar typing (ignores case)
    List<Medicine> findByNameContainingIgnoreCase(String name);
    
    // For AI or manual substitute recommendations 
    List<Medicine> findByGenericNameIgnoreCase(String genericName);
}