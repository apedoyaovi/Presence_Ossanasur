package com.apedo.presence_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class PresenceSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(PresenceSystemApplication.class, args);
	}

}
