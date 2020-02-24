require(['smoke'], smoke => {
    smoke.configure({
        load: [
            'smoke/test/minimal-example-amd'
        ]
    });
});
