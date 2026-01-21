//Registramos el plugin de scroll
gsap.from(".hero_title", {
    y: -100,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out"
});

gsap.fromTo(
    ".hero_subtitle",
    { y: 100, opacity: 0 },
    {
        y: -100,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.3
    }
);