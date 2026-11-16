# Portfolio Tomás Estévez - Estilo Animal Crossing

Portfolio personal con estética inspirada en Animal Crossing / Nintendo DS.

## 🎨 Características del diseño

- ✅ Colores pastel suaves (verdes, azules, amarillos, rosas)
- ✅ Bordes redondeados estilo Nintendo
- ✅ Nubes animadas flotando
- ✅ Decoraciones de hojas, flores y mariposas
- ✅ Tipografía redondeada y amigable (Fredoka + Nunito)
- ✅ Sombras suaves y efectos hover
- ✅ Totalmente responsive
- ✅ Animaciones suaves al hacer scroll

## 📁 Estructura

```
portfolio-animal-crossing/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos
├── js/
│   └── script.js       # Interacciones
├── assets/             # Imágenes de referencia
│   ├── ref-character.jpg
│   ├── ref-stickers.jpg
│   ├── ref-room1.jpg
│   ├── ref-room2.jpg
│   ├── ref-garden.gif
│   └── ...
└── README.md
```

## 🚀 Subir a GitHub Pages

### Opción 1: Por la web (fácil)

1. Creá un repo nuevo en GitHub (público)
2. Subí todos los archivos arrastrándolos
3. Settings → Pages → Deploy from a branch → main / root → Save
4. Listo en 1-2 minutos

### Opción 2: Por Git

```bash
git clone https://github.com/TU-USUARIO/tu-repo.git
cd tu-repo
# Copiar todos los archivos
git add .
git commit -m "Portfolio Animal Crossing"
git push origin main
```

## 🖼️ Personalizar imágenes

Para reemplazar las imágenes placeholder con tus propios proyectos:

1. Guardá tus imágenes en `assets/`
2. En `index.html`, cambiá las rutas:
   ```html
   <img src="assets/mi-proyecto.jpg" alt="Mi proyecto">
   ```

## 🎨 Cambiar colores

Editá las variables en `:root` en `css/style.css`:

```css
:root {
    --ac-green: #7ec850;
    --ac-blue: #5bc8e8;
    --ac-pink: #f8a8c8;
    /* ... */
}
```

## 📝 Secciones incluidas

- Hero con personaje y badges
- Sobre mí con speech bubble
- Habilidades (soft skills + herramientas)
- Proyectos (3 tarjetas con imágenes)
- Contacto con botones grandes

## 💌 Contacto

¿Preguntas? Escribime a **esteveztomii@gmail.com**

---

Hecho con 💚 y mucha inspiración de Animal Crossing
