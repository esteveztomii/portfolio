// ============================================
// PORTFOLIO ANIMAL CROSSING - Interacciones
// ============================================

// Efecto de aparición suave al hacer scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Aplicar a todas las tarjetas y secciones
document.querySelectorAll('.ac-card, .ac-section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Efecto de "pop" en los botones del menú
document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.05)';
    });

    btn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Parallax suave en decoraciones flotantes
document.addEventListener('mousemove', function(e) {
    const decos = document.querySelectorAll('.float-deco');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    decos.forEach((deco, index) => {
        const speed = (index + 1) * 15;
        const x = (mouseX - 0.5) * speed;
        const y = (mouseY - 0.5) * speed;
        deco.style.transform = `translate(${x}px, ${y}px)`;
    });
});

// Scroll suave para navegación
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Efecto de "wiggle" en las flores decorativas al hacer hover
document.querySelectorAll('.deco-flower').forEach(flower => {
    flower.addEventListener('mouseenter', function() {
        this.style.animation = 'none';
        this.style.transform = 'scale(1.3) rotate(15deg)';
        setTimeout(() => {
            this.style.animation = '';
            this.style.transform = '';
        }, 300);
    });
});

// Sonido de "pop" opcional (descomentar si querés agregar un sonido)
/*
const popSound = new Audio('assets/pop.mp3');
document.querySelectorAll('.ac-btn, .menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        popSound.currentTime = 0;
        popSound.play().catch(() => {});
    });
});
*/

// Console easter egg estilo Animal Crossing
console.log('%c🌱 ¡Hola!', 'font-size: 24px; color: #7ec850; font-weight: bold;');
console.log('%c¿Estás buscando algo especial?', 'font-size: 16px; color: #5bc8e8;');
console.log('%cEste portfolio fue cultivado con 💚 por Tomás Estévez', 'font-size: 14px; color: #f8a848;');
console.log('%c🌸 ¡Gracias por visitar! 🌸', 'font-size: 18px; color: #f8a8c8;');
