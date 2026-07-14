package com.example.aegis.order;

import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository {
    List<OrderSummary> findByStatus(String status);
}
