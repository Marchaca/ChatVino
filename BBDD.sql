-- Crear Base de Datos

CREATE DATABASE ChatVino;

-- Usar la Base de Datos

USE ChatVino;

-- Crear Tabla de Usuarios

CREATE TABLE
    Usuarios (
        UsuarioID INT AUTO_INCREMENT PRIMARY KEY,
        Nombre VARCHAR(100) UNIQUE,
        Email VARCHAR(100) UNIQUE,
        Contrasena VARCHAR(100)
    );

-- Crear Tabla de Preferencias del Usuario

CREATE TABLE
    PreferenciasUsuario (
        PreferenciaID INT AUTO_INCREMENT PRIMARY KEY,
        UsuarioID INT NOT NULL,
        TipoEvento VARCHAR(100) NULL,
        Estacion VARCHAR(50) NULL,
        RangoPrecio DECIMAL(10, 2) NULL,
        EstadoAnimo VARCHAR(100) NULL,
        FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
    );

-- Crear Tabla de Tipos de Uvas

CREATE TABLE
    TiposDeUvas (
        UvaID INT AUTO_INCREMENT PRIMARY KEY,
        Nombre VARCHAR(100),
        Caracteristicas TEXT,
        RegionPredominante VARCHAR(100),
        NotasDeSabor TEXT,
        Descripcion TEXT,
        ImagenURL VARCHAR(255)
    );

-- Crear Tabla para las Denominaciones de Origen

CREATE TABLE
    DenominacionesDeOrigen (
        DOID INT AUTO_INCREMENT PRIMARY KEY,
        Nombre VARCHAR(100),
        Descripcion TEXT
    );

-- Crear Tabla Intermedia (UVA - DO)

CREATE TABLE
    UvaDenominacionOrigen (
        UvaID INT,
        DOID INT,
        FOREIGN KEY (UvaID) REFERENCES TiposDeUvas(UvaID),
        FOREIGN KEY (DOID) REFERENCES DenominacionesDeOrigen(DOID),
        PRIMARY KEY (UvaID, DOID)
    );

-- Crear Tabla para los tipos de Vino

CREATE TABLE
    TiposDeVino (
        TipoVinoID INT AUTO_INCREMENT PRIMARY KEY,
        Nombre VARCHAR(50),
        Descripcion TEXT
    );

-- Crear Tabla para Historia del Vino
CREATE TABLE
    VinosHistoria (
        TipoVinoID INT,
        Historia TEXT NOT NULL,
        FOREIGN KEY (TipoVinoID) REFERENCES TiposDeVino(TipoVinoID)
    );

-- Crear Tabla para Informacion Almacenamiento
CREATE TABLE
    AlmacenamientoVinoFAQ (
        FAQID INT AUTO_INCREMENT PRIMARY KEY,
        Respuesta TEXT
    );

-- Crear Tabla para Informacion Servicio

CREATE TABLE
    ServicioFAQ (
        FAQID INT AUTO_INCREMENT PRIMARY KEY,
        Respuesta TEXT
    );

-- Crear Tabla de Botellas

CREATE TABLE
    Botellas (
        BotellaID INT AUTO_INCREMENT PRIMARY KEY,
        Nombre VARCHAR(100),
        AnoCosecha YEAR,
        Region VARCHAR(100),
        Descripcion TEXT,
        Precio DECIMAL(10, 2),
        Volumen VARCHAR(50),
        Stock INT,
        ImagenURL VARCHAR(255),
        Calificacion DECIMAL(3, 2) DEFAULT 0,
        UvaID INT,
        TipoVinoID INT,
        DOID INT,
        FOREIGN KEY (UvaID) REFERENCES TiposDeUvas(UvaID),
        FOREIGN KEY (DOID) REFERENCES DenominacionesDeOrigen(DOID),
        FOREIGN KEY (TipoVinoID) REFERENCES TiposDeVino(TipoVinoID)
    );

ALTER TABLE Botellas MODIFY Calificacion DECIMAL(3, 2) DEFAULT 0;

ALTER TABLE Botellas
ADD COLUMN BodegaID INT,
ADD
    FOREIGN KEY (BodegaID) REFERENCES Bodegas(BodegaID);

ALTER TABLE Botellas ADD COLUMN Maridaje TEXT;

ALTER TABLE Botellas ADD COLUMN NumeroValoraciones INT DEFAULT 0;

-- Crear Tabla de Compras o Interacciones

CREATE TABLE
    Compras (
        CompraID INT AUTO_INCREMENT PRIMARY KEY,
        UsuarioID INT,
        BotellaID INT,
        Cantidad INT,
        FechaCompra DATE,
        FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID),
        FOREIGN KEY (BotellaID) REFERENCES Botellas(BotellaID)
    );

-- Crear Tabla para las Calificaciones

CREATE TABLE
    Calificaciones (
        CalificacionID INT AUTO_INCREMENT PRIMARY KEY,
        UsuarioID INT,
        BotellaID INT,
        Puntuacion INT CHECK (
            Puntuacion BETWEEN 1 AND 5
        ),
        FechaCalificacion DATE,
        Comentario TEXT NULL,
        FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID),
        FOREIGN KEY (BotellaID) REFERENCES Botellas(BotellaID)
    );

CREATE TABLE
    Bodegas (
        BodegaID INT AUTO_INCREMENT PRIMARY KEY,
        Nombre VARCHAR(100),
        Region VARCHAR(100),
        Descripcion TEXT,
        AnoFundacion INT,
        ImagenURL VARCHAR(255),
        ContactoEmail VARCHAR(100)
    );