package com.example.demo.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class UserEventListener {

    private static final Logger logger = LoggerFactory.getLogger(UserEventListener.class);

    @EventListener
    public void onUserCreated(UserCreatedEvent event) {
        logger.info(
            "Spring in-process listener received UserCreatedEvent for {} at {}",
            event.username(),
            event.createdAt()
        );
    }
}
