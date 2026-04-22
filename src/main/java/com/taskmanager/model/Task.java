package com.taskmanager.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.Locale;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate taskDate;

    private LocalTime taskTime;

    private String month;

    @Column(nullable = false)
    private boolean completed;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.taskDate != null) {
            this.month = this.taskDate.getMonth()
                    .getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.taskDate != null) {
            this.month = this.taskDate.getMonth()
                    .getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        }
    }
}
