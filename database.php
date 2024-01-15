<?php
// Detalles de conexión a la base de datos
$host = "127.0.0.1";
$usuario = "u651072339_root";
$contrasena = "Hoyosdel123";
$nombreDeLaBaseDeDatos = "u651072339_chatvino";
$puerto = 3306;

// Crear conexión
$conexion = new mysqli($host, $usuario, $contrasena, $nombreDeLaBaseDeDatos, $puerto);

// Verificar la conexión
if ($conexion->connect_error) {
    die("Conexión fallida: " . $conexion->connect_error);
}

// Tu código para trabajar con la base de datos va aquí

// Cerrar la conexión
$conexion->close();
?>