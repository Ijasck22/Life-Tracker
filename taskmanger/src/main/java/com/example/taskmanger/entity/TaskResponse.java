package com.example.taskmanger.entity;

public class TaskResponse {
	
	private Long id;
    private String title;
    private String description;
    private String status;
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	public String getDescription() {
		return description;
	}
	public TaskResponse(Long id, String title, String description, String status) {
		super();
		this.id = id;
		this.title = title;
		this.description = description;
		this.status = status;
	}
	public TaskResponse() {
		// TODO Auto-generated constructor stub
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}

}
