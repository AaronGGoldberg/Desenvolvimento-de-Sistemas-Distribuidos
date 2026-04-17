package com.exemplo.biblioteca.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.exemplo.biblioteca.model.Livro;

public interface LivroRepository extends JpaRepository<Livro, Long> { }
