package com.movieapp.service;

import com.movieapp.model.Movie;
import com.movieapp.model.MovieCatalogResponse;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
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

    public MovieCatalogResponse getMovies(String search, String genre, int page) {
        if (apiKey.isBlank()) {
            logger.warn("TMDB_API_KEY is not configured; returning an empty movie catalog");
            return new MovieCatalogResponse(List.of(), page, 0, 0,
                    "TMDB_API_KEY chưa được cấu hình trong backend/.env.");
        }

        try {
            Map<Long, String> genreNames = fetchGenreNames();
            JsonNode response = restTemplate.getForObject(buildMovieUrl(search, genre, page, genreNames), JsonNode.class);
            if (response == null || !response.path("results").isArray()) {
                return new MovieCatalogResponse(List.of(), page, 0, 0, "TMDB chưa trả về dữ liệu phim.");
            }

            List<Movie> movies = new ArrayList<>();
            response.path("results").forEach(result -> {
                List<String> movieGenres = new ArrayList<>();
                result.path("genre_ids").forEach(id -> {
                    String name = genreNames.get(id.asLong());
                    if (name != null) movieGenres.add(name);
                });
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
            });
                return new MovieCatalogResponse(
                    movies,
                    response.path("page").asInt(page),
                    response.path("total_pages").asInt(1),
                    response.path("total_results").asInt(movies.size()),
                    null
                );
        } catch (HttpClientErrorException.Unauthorized exception) {
            logger.warn("TMDB rejected the configured API key (401 Unauthorized)");
            return new MovieCatalogResponse(List.of(), page, 0, 0,
                "TMDB từ chối API key. Hãy cập nhật API Key v3 còn hiệu lực trong backend/.env rồi khởi động lại BE.");
        } catch (RestClientException | IllegalArgumentException exception) {
            logger.warn("TMDB catalog request failed ({})", exception.getClass().getSimpleName());
                return new MovieCatalogResponse(List.of(), page, 0, 0,
                    "Không thể tải phim từ TMDB lúc này. Vui lòng thử lại sau.");
        }
    }

    public List<String> getAllGenres() {
        if (apiKey.isBlank()) return List.of();
        try {
            return fetchGenreNames().values().stream().distinct().sorted().collect(Collectors.toList());
        } catch (RestClientException | IllegalArgumentException exception) {
            logger.warn("TMDB genre request failed ({})", exception.getClass().getSimpleName());
            return List.of();
        }
    }

    private String buildMovieUrl(String search, String genre, int page, Map<Long, String> genreNames) {
        boolean hasSearch = search != null && !search.isBlank();
        String path = hasSearch ? "/search/movie" : "/discover/movie";
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(TMDB_API + path)
                .queryParam("api_key", apiKey)
                .queryParam("language", "vi-VN")
                .queryParam("include_adult", false)
                .queryParam("page", page);
        if (hasSearch) {
            builder.queryParam("query", search);
        } else {
            builder.queryParam("sort_by", "popularity.desc");
            if (genre != null && !genre.isBlank()) {
                genreNames.entrySet().stream()
                        .filter(entry -> entry.getValue().equalsIgnoreCase(genre))
                        .findFirst()
                        .ifPresent(entry -> builder.queryParam("with_genres", entry.getKey()));
            }
        }
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