package com.skillproof.repository;

import com.skillproof.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(String email);
    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String role);
    List<Notification> findByRecipientEmailOrRecipientRoleOrderByCreatedAtDesc(String email, String role);
}
