package com.quickrx.erp.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource; // FIXED: Missing import
import org.springframework.http.MediaType;    // FIXED: Missing import
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PharmacyAiController {

    private final PharmacyAiService aiService;

    @GetMapping("/substitutes")
    public ResponseEntity<Map<String, String>> getSubstitutes(@RequestParam String medicine) {
        String aiResponse = aiService.findGenericAlternatives(medicine);
        return ResponseEntity.ok(Map.of("recommendation", aiResponse));
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String response = aiService.chat(request.get("message"));
        return ResponseEntity.ok(Map.of("reply", response));
    }

    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> scanPrescription(@RequestParam("file") MultipartFile file) {
        try {
            // Step 1: Convert uploaded file to a Spring Resource
            Resource imageResource = file.getResource();
            
            // Step 2: Send to Gemini Vision
            String aiAnalysis = aiService.analyzePrescription(imageResource);
            
            // Step 3: Return the JSON string to React
            return ResponseEntity.ok(Map.of("recommendation", aiAnalysis));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Vision failed: " + e.getMessage()));
        }
    }
}