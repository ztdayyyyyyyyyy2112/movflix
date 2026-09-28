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
    private Map<Long, String> cachedMovieGenreNames;
    private Map<Long, String> cachedTvGenreNames;

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

    public MovieCatalogResponse getMovies(String search, String genre, int page, String type, String category) {
        if (apiKey.isBlank()) {
            logger.warn("TMDB_API_KEY is not configured; returning an empty movie catalog");
            return new MovieCatalogResponse(List.of(), page, 0, 0,
                    "TMDB_API_KEY chưa được cấu hình trong backend/.env.");
        }

        String mediaType = "tv".equalsIgnoreCase(type) ? "tv" : "movie";
        try {
            Map<Long, String> genreNames = fetchGenreNames(mediaType);
            JsonNode response = restTemplate.getForObject(buildMovieUrl(search, genre, page, genreNames, mediaType, category), JsonNode.class);
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
                    result.path("title").asText(result.path("name").asText("Untitled")),
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

    public List<String> getAllGenres(String type) {
        if (apiKey.isBlank()) return List.of();
        try {
            String mediaType = "tv".equalsIgnoreCase(type) ? "tv" : "movie";
            return fetchGenreNames(mediaType).values().stream().distinct().sorted().collect(Collectors.toList());
        } catch (RestClientException | IllegalArgumentException exception) {
            logger.warn("TMDB genre request failed ({})", exception.getClass().getSimpleName());
            return List.of();
        }
    }

    private String buildMovieUrl(String search, String genre, int page, Map<Long, String> genreNames,
                                 String mediaType, String category) {
        boolean hasSearch = search != null && !search.isBlank();
        String safeCategory = category == null ? "popular" : category.toLowerCase();
        String path;
        if (hasSearch) {
            path = "/search/" + mediaType;
        } else if (genre != null && !genre.isBlank()) {
            path = "/discover/" + mediaType;
        } else if ("trending".equals(safeCategory)) {
            path = "/trending/" + mediaType + "/week";
        } else if ("tv".equals(mediaType)) {
            path = switch (safeCategory) {
                case "airing_today" -> "/tv/airing_today";
                case "top_rated" -> "/tv/top_rated";
                case "on_the_air" -> "/tv/on_the_air";
                default -> "/tv/popular";
            };
        } else {
            path = switch (safeCategory) {
                case "now_playing" -> "/movie/now_playing";
                case "top_rated" -> "/movie/top_rated";
                case "upcoming" -> "/movie/upcoming";
                default -> "/movie/popular";
            };
        }
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(TMDB_API + path)
                .queryParam("api_key", apiKey)
                .queryParam("language", "vi-VN")
                .queryParam("include_adult", false)
                .queryParam("page", page);
        if (hasSearch) {
            builder.queryParam("query", search);
        } else if (path.startsWith("/discover/")) {
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

    private synchronized Map<Long, String> fetchGenreNames(String mediaType) {
        Map<Long, String> cached = "tv".equals(mediaType) ? cachedTvGenreNames : cachedMovieGenreNames;
        if (cached != null) return cached;
        String url = UriComponentsBuilder.fromHttpUrl(TMDB_API + "/genre/" + mediaType + "/list")
                .queryParam("api_key", apiKey)
                .queryParam("language", "vi-VN")
                .build().encode().toUriString();
        JsonNode response = restTemplate.getForObject(url, JsonNode.class);
        Map<Long, String> names = new HashMap<>();
        if (response != null && response.path("genres").isArray()) {
            response.path("genres").forEach(item -> names.put(item.path("id").asLong(), item.path("name").asText()));
        }
        Map<Long, String> genreNames = Map.copyOf(names);
        if ("tv".equals(mediaType)) cachedTvGenreNames = genreNames;
        else cachedMovieGenreNames = genreNames;
        return genreNames;
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