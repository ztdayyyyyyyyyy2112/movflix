package com.movieapp.model;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.util.List;

@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class Movie {
    private final Long id;
    private final String title;
    private final String poster;
    private final String banner;
    private final String description;
    private final List<String> genres;
    private final String streamUrl;

    public Movie(Long id, String title, String poster, String banner, String description,
                 List<String> genres, String streamUrl) {
        this.id = id;
        this.title = title;
        this.poster = poster;
        this.banner = banner;
        this.description = description;
        this.genres = genres;
        this.streamUrl = streamUrl;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getPoster() { return poster; }
    public String getBanner() { return banner; }
    public String getDescription() { return description; }
    public List<String> getGenres() { return genres; }
    public String getStreamUrl() { return streamUrl; }
}