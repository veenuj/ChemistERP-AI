package com.quickrx.erp.inventory;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final MedicineRepository medicineRepository;

    @Transactional
    public Medicine addMedicine(Medicine medicine) {
        // In a production app, you'd add validation here (e.g., checking if barcode already exists)
        return medicineRepository.save(medicine);
    }

    @Transactional(readOnly = true)
    public Medicine scanBarcode(String barcode) {
        return medicineRepository.findByBarcode(barcode)
                .orElseThrow(() -> new RuntimeException("Medicine not found for barcode: " + barcode));
    }

    @Transactional(readOnly = true)
    public List<Medicine> searchByName(String name) {
        return medicineRepository.findByNameContainingIgnoreCase(name);
    }

    @Transactional(readOnly = true)
    public List<Medicine> findSubstitutes(String genericName) {
        return medicineRepository.findByGenericNameIgnoreCase(genericName);
    }
    
    @Transactional(readOnly = true)
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    public Medicine updateMedicine(Long id, Medicine details) {
    Medicine med = medicineRepository.findById(id).orElseThrow();
    med.setName(details.getName());
    med.setGenericName(details.getGenericName());
    med.setPrice(details.getPrice());
    med.setStockLevel(details.getStockLevel());
    med.setBarcode(details.getBarcode());
    med.setBatchNumber(details.getBatchNumber());
    med.setShelfLocation(details.getShelfLocation());
    return medicineRepository.save(med);
    }

    public void deleteMedicine(Long id) {
        medicineRepository.deleteById(id);
    }
}