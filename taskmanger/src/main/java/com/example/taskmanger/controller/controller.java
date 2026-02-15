package com.example.taskmanger.controller;

import java.util.List;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.taskmanger.entity.TaskRequest;
import com.example.taskmanger.entity.TaskResponse;
import com.example.taskmanger.service.TaskService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tasks")
public class controller {
	

	    @Autowired
	    private TaskService service;

	    @PostMapping
	    public ResponseEntity<TaskResponse> create(@RequestBody @Valid TaskRequest request) {
	        return ResponseEntity.ok(service.create(request));
	    }

	    @GetMapping
	    public List<TaskResponse> getAll() {
	        return service.getAll();
	    }

	    @GetMapping("/{id}")
	    public TaskResponse getById(@PathVariable Long id) {
	        return service.getById(id);
	    }

	    @DeleteMapping("/{id}")
	    public ResponseEntity<String> delete(@PathVariable Long id) {
	        service.delete(id);
	        return ResponseEntity.ok("Deleted successfully");
	    }
	    
	    
	

}


