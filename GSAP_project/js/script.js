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

gsap.fromTo(
    ".stamp_1",
    { x: -120, y: 0, opacity: 0 },
    { x: 0, y: -120, opacity: 1, ease: "power3.out", delay: 0.6 }
);

gsap.fromTo(
    ".stamp_2",
    { x: -120, y: 0, opacity: 0 },
    { x: 0, y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 1.5 }
);

gsap.fromTo(
    ".stamp_3",
    { x: 0, y: 200, opacity: 0 },
    { x: 0, y: 100, opacity: 1, duration: 2.2, ease: "power1.out", delay: 2.5 }
);