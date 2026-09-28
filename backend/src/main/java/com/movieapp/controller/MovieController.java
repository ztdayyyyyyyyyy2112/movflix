package com.movieapp.controller;

import com.movieapp.model.Movie;
import com.movieapp.service.MovieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/movies")
@CrossOrigin(origins = "http://localhost:3000")
public class MovieController {

    @Autowired
    private MovieService movieService;

    @GetMapping
    public List<Movie> getMovies(@RequestParam(required = false) String genre,
                                 @RequestParam(required = false) String search) {
        return movieService.getMovies(search, genre);
    }

    @GetMapping("/genres")
    public List<String> getGenres() {
        return movieService.getAllGenres();
    }
}