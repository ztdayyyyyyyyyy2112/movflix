package com.movieapp.service;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "movieapp")
public class MovieCatalogProperties {
    private Map<Long, String> licensedStreams = new HashMap<>();

    public Map<Long, String> getLicensedStreams() {
        return licensedStreams;
    }

    public void setLicensedStreams(Map<Long, String> licensedStreams) {
        this.licensedStreams = licensedStreams;
    }
}