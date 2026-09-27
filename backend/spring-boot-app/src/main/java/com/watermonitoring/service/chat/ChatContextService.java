package com.watermonitoring.service.chat;

import com.watermonitoring.service.chat.context.AdminContextProvider;
import com.watermonitoring.service.chat.context.CommunityAdminContextProvider;
import com.watermonitoring.service.chat.context.PublicContextProvider;
import com.watermonitoring.service.chat.context.ResidentContextProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * ChatContextService — Selects and coordinates the appropriate context provider
 * based on the user's authenticated role or public landing page state.
 */
@Service
public class ChatContextService {

    private final PublicContextProvider publicContextProvider;
    private final AdminContextProvider adminContextProvider;
    private final CommunityAdminContextProvider communityAdminContextProvider;
    private final ResidentContextProvider residentContextProvider;

    @Autowired
    public ChatContextService(PublicContextProvider publicContextProvider,
                              AdminContextProvider adminContextProvider,
                              CommunityAdminContextProvider communityAdminContextProvider,
                              ResidentContextProvider residentContextProvider) {
        this.publicContextProvider = publicContextProvider;
        this.adminContextProvider = adminContextProvider;
        this.communityAdminContextProvider = communityAdminContextProvider;
        this.residentContextProvider = residentContextProvider;
    }

    public String buildPublicContext() {
        return publicContextProvider.buildContext();
    }

    public String buildAdminContext(String email) {
        return adminContextProvider.buildContext(email);
    }

    public String buildCommunityAdminContext(String email) {
        return communityAdminContextProvider.buildContext(email);
    }

    public String buildResidentContext(String email) {
        return residentContextProvider.buildContext(email);
    }
}
