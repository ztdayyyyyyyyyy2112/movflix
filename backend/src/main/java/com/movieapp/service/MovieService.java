package com.movieapp.service;

import com.movieapp.model.Movie;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.client.RestTemplate;
import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MovieService {

    private static final Logger logger = LoggerFactory.getLogger(MovieService.class);
    private static final String TMDB_API = "https://api.themoviedb.org/3";
    private final RestTemplate restTemplate;
    private final String apiKey;
    private final MovieCatalogProperties catalogProperties;
    private Map<Long, String> cachedGenreNames;

    public MovieService(RestTemplateBuilder restTemplateBuilder,
                        @Value("${tmdb.api-key:}") String apiKey,
                        MovieCatalogProperties catalogProperties) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
        this.apiKey = apiKey;
        this.catalogProperties = catalogProperties;
    }

    public List<Movie> getAllMovies() {
        return getMovies(null, null);
    }

    public List<Movie> getMovies(String search, String genre) {
        if (apiKey.isBlank()) {
            logger.warn("TMDB_API_KEY is not configured; returning an empty movie catalog");
            return List.of();
        }

        try {
            Map<Long, String> genreNames = fetchGenreNames();
            JsonNode response = restTemplate.getForObject(buildMovieUrl(search), JsonNode.class);
            if (response == null || !response.path("results").isArray()) return List.of();

            List<Movie> movies = new ArrayList<>();
            response.path("results").forEach(result -> {
                List<String> movieGenres = new ArrayList<>();
                result.path("genre_ids").forEach(id -> {
                    String name = genreNames.get(id.asLong());
                    if (name != null) movieGenres.add(name);
                });
                if (genre == null || genre.isBlank() || movieGenres.stream().anyMatch(name -> name.equalsIgnoreCase(genre))) {
                    long id = result.path("id").asLong();
                    movies.add(new Movie(
                            id,
                            result.path("title").asText("Untitled"),
                            imageUrl(result.path("poster_path").asText(null), "w500"),
                            imageUrl(result.path("backdrop_path").asText(null), "w1280"),
                            result.path("overview").asText(""),
                            movieGenres,
                            licensedStreamUrl(id)
                    ));
                }
            });
            return movies;
        } catch (RestClientException | IllegalArgumentException exception) {
            logger.warn("TMDB catalog request failed: {}", exception.getMessage());
            return List.of();
        }
    }

    public List<String> getAllGenres() {
        if (apiKey.isBlank()) return List.of();
        try {
            return fetchGenreNames().values().stream().distinct().sorted().collect(Collectors.toList());
        } catch (RestClientException | IllegalArgumentException exception) {
            logger.warn("TMDB genre request failed: {}", exception.getMessage());
            return List.of();
        }
    }

    private String buildMovieUrl(String search) {
        String path = search == null || search.isBlank() ? "/discover/movie" : "/search/movie";
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(TMDB_API + path)
                .queryParam("api_key", apiKey)
                .queryParam("language", "vi-VN")
                .queryParam("include_adult", false)
                .queryParam("page", 1);
        if (path.equals("/discover/movie")) builder.queryParam("sort_by", "popularity.desc");
        else builder.queryParam("query", search);
        return builder.build().encode().toUriString();
    }

    private synchronized Map<Long, String> fetchGenreNames() {
        if (cachedGenreNames != null) return cachedGenreNames;
        String url = UriComponentsBuilder.fromHttpUrl(TMDB_API + "/genre/movie/list")
                .queryParam("api_key", apiKey)
                .queryParam("language", "vi-VN")
                .build().encode().toUriString();
        JsonNode response = restTemplate.getForObject(url, JsonNode.class);
        Map<Long, String> names = new HashMap<>();
        if (response != null && response.path("genres").isArray()) {
            response.path("genres").forEach(item -> names.put(item.path("id").asLong(), item.path("name").asText()));
        }
        cachedGenreNames = Map.copyOf(names);
        return cachedGenreNames;
    }

    private String imageUrl(String path, String size) {
        return path == null || path.isBlank() ? null : "https://image.tmdb.org/t/p/" + size + path;
    }

    private String licensedStreamUrl(long movieId) {
        String streamUrl = catalogProperties.getLicensedStreams().get(movieId);
        if (streamUrl == null || streamUrl.isBlank()) return null;
        try {
            URI uri = URI.create(streamUrl);
            return "https".equalsIgnoreCase(uri.getScheme())
                    && uri.getHost() != null
                    && uri.getPath() != null
                    && uri.getPath().toLowerCase().endsWith(".m3u8") ? streamUrl : null;
        } catch (IllegalArgumentException exception) {
            logger.warn("Ignoring invalid licensed stream URL configured for movie {}", movieId);
            return null;
        }
    }
}