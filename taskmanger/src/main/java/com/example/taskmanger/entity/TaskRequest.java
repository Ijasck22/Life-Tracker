package com.example.taskmanger.entity;

import jakarta.validation.constraints.NotBlank;

public class TaskRequest {


	    @NotBlank
	    private String title;

	    private String description;

		public TaskRequest(@NotBlank String title, String description) {
			super();
			this.title = title;
			this.description = description;
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

		public void setDescription(String description) {
			this.description = description;
		}
	}


