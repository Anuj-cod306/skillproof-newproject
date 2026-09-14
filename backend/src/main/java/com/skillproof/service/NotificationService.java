package com.skillproof.service;

import com.skillproof.entity.Notification;
import com.skillproof.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public Notification createNotification(
            String recipientEmail,
            String recipientRole,
            String title,
            String message,
            String type,
            String status,
            String link,
            Long jobId,
            Long applicationId,
            String company,
            String jobTitle,
            String candidateName
    ) {
        Notification notification = Notification.builder()
                .recipientEmail(recipientEmail != null ? recipientEmail : "")
                .recipientRole(recipientRole != null ? recipientRole.toLowerCase() : "")
                .title(title)
                .message(message)
                .type(type != null ? type : "job")
                .status(status)
                .link(link)
                .jobId(jobId)
                .applicationId(applicationId)
                .company(company)
                .jobTitle(jobTitle)
                .candidateName(candidateName)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("[NotificationService] Created notification {} for {} / role: {}", saved.getId(), recipientEmail, recipientRole);
        return saved;
    }

    public List<Map<String, Object>> getNotificationsForUser(String email, String role) {
        String cleanRole = role != null ? role.replace("ROLE_", "").toLowerCase() : "";
        if ("academician".equals(cleanRole)) {
            cleanRole = "academia";
        }

        List<Notification> notifs;
        if (cleanRole.isBlank()) {
            notifs = notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email);
        } else {
            notifs = notificationRepository.findByRecipientEmailOrRecipientRoleOrderByCreatedAtDesc(email, cleanRole);
        }

        List<Map<String, Object>> list = new ArrayList<>();
        for (Notification n : notifs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", n.getId());
            map.put("title", n.getTitle());
            map.put("message", n.getMessage());
            map.put("type", n.getType());
            map.put("status", n.getStatus());
            map.put("link", n.getLink());
            map.put("jobId", n.getJobId());
            map.put("applicationId", n.getApplicationId());
            map.put("company", n.getCompany());
            map.put("jobTitle", n.getJobTitle());
            map.put("candidateName", n.getCandidateName());
            map.put("read", n.isRead());
            map.put("time", formatTimeAgo(n.getCreatedAt()));
            map.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : "");
            list.add(map);
        }
        return list;
    }

    @Transactional
    public boolean markAsRead(Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setRead(true);
            notificationRepository.save(n);
            return true;
        }
        return false;
    }

    @Transactional
    public void markAllAsRead(String email, String role) {
        String cleanRole = role != null ? role.replace("ROLE_", "").toLowerCase() : "";
        List<Notification> notifs = notificationRepository.findByRecipientEmailOrRecipientRoleOrderByCreatedAtDesc(email, cleanRole);
        for (Notification n : notifs) {
            n.setRead(true);
        }
        notificationRepository.saveAll(notifs);
    }

    private String formatTimeAgo(LocalDateTime dt) {
        if (dt == null) return "Recent";
        long diffSeconds = java.time.Duration.between(dt, LocalDateTime.now()).getSeconds();
        if (diffSeconds < 60) return "Just now";
        if (diffSeconds < 3600) return (diffSeconds / 60) + "m ago";
        if (diffSeconds < 86400) return (diffSeconds / 3600) + "h ago";
        return (diffSeconds / 86400) + "d ago";
    }
}
