import sailpoint.tools.GeneralException;
import sailpoint.object.ProvisioningPlan;
import sailpoint.object.ProvisioningPlan.AccountRequest;
import sailpoint.object.ProvisioningPlan.AttributeRequest;
import sailpoint.object.ProvisioningResult;
import sailpoint.object.EmailOptions;
import sailpoint.object.EmailTemplate;
import sailpoint.object.Identity;
import sailpoint.api.SailPointContext;
import sailpoint.object.Application;

import sailpoint.messaging.sms.TwilioServiceProvider;

import sailpoint.tools.Util;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

Log log = LogFactory.getLog("rule.afterProvisioningRule");

try {

    String usersAMAccountName = "";
    String plainPassword = "";
    String encryptedPassword = "";
    String trackingID = "";
    String id_mobile = "";

    String opName = "IAM Operation";
    String opEmail = "operation@sa.zain.com";

    Identity identity = null;

    if (plan == null || plan.getIdentity() == null) {
        log.warn("Provisioning plan or identity is null");
        return;
    }

    trackingID = plan.getTrackingId();
    identity = plan.getIdentity();

    String identityName = identity.getDisplayName();
    String userEmail = identity.getAttribute("emailAddressPersonal");

    if (Util.isNullOrEmpty(userEmail)) {
        log.warn("User email is null or empty for identity: " + identityName);
    }

    List<AccountRequest> accountRequests = plan.getAccountRequests("02-Active Directory");

    if (accountRequests == null || accountRequests.isEmpty()) {
        log.debug("No AD account requests found");
        return;
    }

    for (AccountRequest accountRequest : accountRequests) {

        if (!AccountRequest.Operation.Create.equals(accountRequest.getOperation())) {
            continue;
        }

        // ========= Extract Attributes =========
        AttributeRequest attrSam = accountRequest.getAttributeRequest("sAMAccountName");
        if (attrSam != null) {
            usersAMAccountName = (String) attrSam.getValue();
        }

        AttributeRequest attrPassword = accountRequest.getAttributeRequest("password");
        if (attrPassword != null) {
            encryptedPassword = (String) attrPassword.getValue();
            if (!Util.isNullOrEmpty(encryptedPassword)) {
                plainPassword = context.decrypt(encryptedPassword);
            }
        }

        AttributeRequest attrMobile = accountRequest.getAttributeRequest("homePhone");
        if (attrMobile != null) {
            id_mobile = (String) attrMobile.getValue();
        }

        // ========= Check Result =========
        ProvisioningResult result = accountRequest.getResult();
        if (result == null) {
            log.warn("Provisioning result is null for user: " + identityName);
            continue;
        }

        String status = result.getStatus();

        // ========= SUCCESS =========
        if ("Committed".equalsIgnoreCase(status)) {

            // ----- Send SMS -----
            if (!Util.isNullOrEmpty(id_mobile)) {
                StringBuilder messageContent = new StringBuilder();
                messageContent.append("Hi ").append(identityName).append("!\n")
                        .append("Welcome to Zain KSA.\n")
                        .append("Your Active Directory account has been created successfully.\n")
                        .append("Username: ").append(usersAMAccountName).append("\n")
                        .append("Please check your email for password details.\n")
                        .append("We wish you all the best!");

                try {
                    new TwilioServiceProvider()
                            .sendCustomMessage(messageContent.toString(), id_mobile);
                    log.info("SMS sent successfully to: " + id_mobile);
                } catch (Exception ex) {
                    log.error("Failed to send SMS to: " + id_mobile, ex);
                }
            }

            // ----- Send Success Email -----
            if (!Util.isNullOrEmpty(userEmail)) {
                try {
                    EmailTemplate template = context.getObjectByName(
                            EmailTemplate.class,
                            "ZAIN - AD Account Creation Completed Notification"
                    );

                    if (template != null) {
                        EmailOptions options = new EmailOptions();
                        options.setTo(userEmail);

                        Map<String, Object> args = new HashMap<>();
                        args.put("identityDisplayName", identityName);
                        args.put("samAccountType", usersAMAccountName);
                        args.put("password", plainPassword); // ⚠️ يفضل Reset Link بدلها

                        options.setVariables(args);
                        context.sendEmailNotification(template, options);

                        log.info("Success email sent to: " + userEmail);
                    } else {
                        log.error("Email template not found (Success)");
                    }

                } catch (Exception ex) {
                    log.error("Failed to send success email", ex);
                }
            }
        }

        // ========= FAILED =========
        else if ("Failed".equalsIgnoreCase(status)) {

            String identityRequestId =
                    (plan.get("identityRequestId") != null)
                            ? plan.get("identityRequestId").toString()
                            : "N/A";

            String adError = "Unknown error";
            if (result.getErrors() != null && !result.getErrors().isEmpty()) {
                adError = result.getErrors().get(0).getKey();
            }

            try {
                EmailTemplate template = context.getObjectByName(
                        EmailTemplate.class,
                        "ZAIN - AD Account Creation Failed Notification"
                );

                if (template != null) {
                    EmailOptions options = new EmailOptions();
                    options.setTo(opEmail);

                    Map<String, Object> args = new HashMap<>();
                    args.put("recipientDisplayName", opName);
                    args.put("identityDisplayName", identityName);
                    args.put("samAccountType", usersAMAccountName);
                    args.put("adError", adError);
                    args.put("userReqID", identityRequestId);

                    options.setVariables(args);
                    context.sendEmailNotification(template, options);

                    log.info("Failure notification sent to operations team");
                } else {
                    log.error("Email template not found (Failure)");
                }

            } catch (Exception ex) {
                log.error("Failed to send failure notification email", ex);
            }
        }
    }

} catch (Exception e) {
    log.error("Error in After Provisioning Rule", e);
}
