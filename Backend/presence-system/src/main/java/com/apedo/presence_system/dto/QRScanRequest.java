package com.apedo.presence_system.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QRScanRequest {
    private String qrData;
    private String action;
    private String reason;
}
