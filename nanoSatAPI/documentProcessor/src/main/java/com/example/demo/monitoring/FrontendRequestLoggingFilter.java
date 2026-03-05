package com.example.demo.monitoring;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

@Component
public class FrontendRequestLoggingFilter extends OncePerRequestFilter {

    private static final int MAX_BODY_PREVIEW_CHARS = 1200;

    private final MonitoringStateService monitoringStateService;

    public FrontendRequestLoggingFilter(MonitoringStateService monitoringStateService) {
        this.monitoringStateService = monitoringStateService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/monitoring");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long start = System.nanoTime();
        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long durationMs = (System.nanoTime() - start) / 1_000_000L;
            String origin = wrappedRequest.getHeader("Origin");
            String referer = wrappedRequest.getHeader("Referer");
            String source = (origin != null || referer != null) ? "frontend" : "unknown/internal";
            String bodyPreview = extractBodyPreview(wrappedRequest);

            monitoringStateService.recordRequest(new RequestTrace(
                Instant.now(),
                wrappedRequest.getMethod(),
                wrappedRequest.getRequestURI(),
                wrappedRequest.getQueryString(),
                wrappedResponse.getStatus(),
                durationMs,
                origin,
                referer,
                wrappedRequest.getRemoteAddr(),
                wrappedRequest.getHeader("User-Agent"),
                source,
                bodyPreview
            ));

            wrappedResponse.copyBodyToResponse();
        }
    }

    private String extractBodyPreview(ContentCachingRequestWrapper request) {
        byte[] body = request.getContentAsByteArray();
        if (body.length == 0) {
            return "";
        }

        String contentType = request.getContentType();
        if (contentType != null) {
            String lower = contentType.toLowerCase();
            boolean readable = lower.contains("application/json")
                || lower.contains("text/")
                || lower.contains("application/xml")
                || lower.contains("application/x-www-form-urlencoded");
            if (!readable) {
                return "[body omitted for content-type " + contentType + ", size=" + body.length + " bytes]";
            }
        }

        Charset charset = StandardCharsets.UTF_8;
        if (request.getCharacterEncoding() != null) {
            try {
                charset = Charset.forName(request.getCharacterEncoding());
            } catch (Exception ignored) {
                charset = StandardCharsets.UTF_8;
            }
        }

        String text = new String(body, charset).replaceAll("\\s+", " ").trim();
        if (text.length() <= MAX_BODY_PREVIEW_CHARS) {
            return text;
        }
        return text.substring(0, MAX_BODY_PREVIEW_CHARS) + "...";
    }
}
