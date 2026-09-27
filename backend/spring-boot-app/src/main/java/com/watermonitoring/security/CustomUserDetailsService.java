package com.watermonitoring.security;
import com.watermonitoring.entity.User;
import com.watermonitoring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;
    @Autowired
    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Support demo accounts
        if ("admin@watermonitor.com".equalsIgnoreCase(email)) {
            return new org.springframework.security.core.userdetails.User(
                    email, "", List.of(new SimpleGrantedAuthority("ROLE_COMMUNITY_ADMIN")));
        }
        if ("communityadmin@watermonitor.com".equalsIgnoreCase(email)) {
            return new org.springframework.security.core.userdetails.User(
                    email, "", List.of(new SimpleGrantedAuthority("ROLE_PROPERTY_ADMIN")));
        }
        if ("community@aquaplus.com".equalsIgnoreCase(email)) {
            return new org.springframework.security.core.userdetails.User(
                    email, "", List.of(new SimpleGrantedAuthority("ROLE_COMMUNITY_ADMIN")));
        }
        if ("resident@watermonitor.com".equalsIgnoreCase(email)) {
            return new org.springframework.security.core.userdetails.User(
                    email, "", List.of(new SimpleGrantedAuthority("ROLE_RESIDENT")));
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        var authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }
}
