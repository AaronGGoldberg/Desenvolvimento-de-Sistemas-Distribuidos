package com.exemplo.biblioteca.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.exemplo.biblioteca.model.Autor;

public interface AutorRepository extends JpaRepository<Autor, Long> { }
