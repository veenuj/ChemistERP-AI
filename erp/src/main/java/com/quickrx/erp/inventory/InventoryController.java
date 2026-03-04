package com.quickrx.erp.inventory;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@CrossOrigin(origins = "*") // Allows the React frontend to communicate with this backend
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping
    public ResponseEntity<Medicine> addMedicine(@RequestBody Medicine medicine) {
        Medicine savedMedicine = inventoryService.addMedicine(medicine);
        return new ResponseEntity<>(savedMedicine, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Medicine>> getAllMedicines() {
        return ResponseEntity.ok(inventoryService.getAllMedicines());
    }

    @GetMapping("/scan/{barcode}")
    public ResponseEntity<Medicine> scanBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(inventoryService.scanBarcode(barcode));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Medicine>> searchMedicine(@RequestParam String name) {
        return ResponseEntity.ok(inventoryService.searchByName(name));
    }

    @GetMapping("/substitutes")
    public ResponseEntity<List<Medicine>> getSubstitutes(@RequestParam String genericName) {
        return ResponseEntity.ok(inventoryService.findSubstitutes(genericName));
    }

        @PutMapping("/{id}")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Long id, @RequestBody Medicine details) {
        return ResponseEntity.ok(inventoryService.updateMedicine(id, details));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicine(@PathVariable Long id) {
        inventoryService.deleteMedicine(id);
        return ResponseEntity.noContent().build();
    }
}