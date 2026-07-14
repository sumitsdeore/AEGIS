package com.example.aegis.order;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public List<OrderSummary> listOrders(String status) {
        return orderRepository.findByStatus(status);
    }
}
