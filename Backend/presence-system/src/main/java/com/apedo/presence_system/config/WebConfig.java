package com.apedo.presence_system.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // La configuration CORS est maintenant dans SecurityConfig
}
