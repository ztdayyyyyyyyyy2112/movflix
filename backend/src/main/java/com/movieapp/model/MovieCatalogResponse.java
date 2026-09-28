package com.movieapp.model;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.util.List;

@JsonNaming(PropertyNamingStrategies.LowerCamelCaseStrategy.class)
public class MovieCatalogResponse {
    private final List<Movie> movies;
    private final int page;
    private final int totalPages;
    private final int totalResults;
    private final String message;

    public MovieCatalogResponse(List<Movie> movies, int page, int totalPages, int totalResults, String message) {
        this.movies = List.copyOf(movies);
        this.page = page;
        this.totalPages = totalPages;
        this.totalResults = totalResults;
        this.message = message;
    }

    public List<Movie> getMovies() { return movies; }
    public int getPage() { return page; }
    public int getTotalPages() { return totalPages; }
    public int getTotalResults() { return totalResults; }
    public String getMessage() { return message; }
}