package com.example.demo.web;

import com.example.demo.event.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users/create")
    public String createUser(@RequestParam(defaultValue = "alice") String username) {
        userService.createUser(username);
        return "Created user " + username + " and published Spring event (and Kafka if enabled).";
    }
}
