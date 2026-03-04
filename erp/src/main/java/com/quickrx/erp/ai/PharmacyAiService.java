package com.quickrx.erp.ai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;
import org.springframework.core.io.Resource;


@Service
public class PharmacyAiService {

    private final ChatClient chatClient;

    // We inject the ChatClient.Builder, which Spring Boot auto-configures for Gemini
    public PharmacyAiService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public String findGenericAlternatives(String medicineName) {
        String prompt = String.format(
            "You are an expert pharmacist assistant. " +
            "A patient is asking for '%s', but it might be out of stock. " +
            "Provide 2-3 common generic alternatives and briefly explain the active ingredients. " +
            "Keep the response professional, brief, and formatted as a simple list.", 
            medicineName
        );

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }
    public String chat(String userMessage) {
    String systemPrompt = "You are an expert Clinical Pharmacist AI. " +
            "Provide accurate, concise medical information. " +
            "If asked about medicines, suggest generic names. " +
            "Always include a disclaimer: 'Consult a doctor for clinical decisions.'";
            
    return chatClient.prompt()
            .system(systemPrompt)
            .user(userMessage)
            .call()
            .content();
    }

    public String analyzePrescription(Resource imageResource) {
        String prompt = """
            Act as a professional Clinical Pharmacist. 
            Analyze this prescription image and:
            1. Extract all medicine names (brand or generic).
            2. For each, extract the dosage and frequency if visible.
            3. Return ONLY a valid JSON array of objects.
            
            Format: [{"name": "Medicine Name", "dosage": "Strength/Freq"}]
            
            Constraint: If handwriting is illegible, omit that specific item. 
            Do not include any conversational text or markdown blocks, just the JSON array.
            """;

        return chatClient.prompt()
                .user(u -> u.text(prompt).media(MimeTypeUtils.IMAGE_JPEG, imageResource))
                .call()
                .content();
    }


}