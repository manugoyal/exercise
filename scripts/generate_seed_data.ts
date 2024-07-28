#!/usr/bin/env npx tsx

import { IOData } from "../app/src/typespecs/io_types";

const ioData: IOData = {
  exercises: [
    {
      name: "lower back stretch",
      description:
        "Lie on your back. Lift one leg up and twist over to one side.",
    },
    {
      name: "crossbody lat stretch",
      description:
        "Lie in a child's pose. Clasp both hands together and twist into one side.",
    },
    {
      name: "lateral hip openers",
      description:
        "In a wide-legged stance, bend from side-to-side, extending your hips.",
    },
    {
      name: "airplanes",
      description:
        "Balanced on one foot, lean your body forward until the other leg is straight back and your arms are extended outwards.",
    },
    {
      name: "internal side stretch",
      description:
        "Stand with one leg ahead of the other. Bend down and try to touch your hands to the floor between your legs.",
    },
    {
      name: "head to knee",
      description:
        "Sitting on the ground, stick one leg out and pretzel the other leg against it. Stretch your body forward and try to touch the outstretched leg with your hands and your head to your knee.",
    },
    {
      name: "single leg knee tuck",
      description: "Lying flat on your back, tuck one knee into your chest.",
    },
    {
      name: "both legs knee tuck",
      description: "Lying flat on your back, tuck both knees into your chest.",
    },
    {
      name: "seated forward fold",
      description:
        "Sitting on the ground, stick both legs out and bend forward, trying to touch your feet with your hands and your knees with your head.",
    },
    {
      name: "spiderman stretch",
      description:
        "Start in a high plank position. Alternating legs, bring one up to align with your arms/shoulder, and then bring it back.",
    },
    {
      name: "equestrian",
      description:
        "With one foot planted on the ground, stick the other one back lying on the ground. Bend forward and support yourself lightly with your hands.",
    },
    {
      name: "figure-four stretch",
      description:
        "Lying on your back, bend one leg up into a 90 degree angle. Lift up your other leg and place the foot of the bent leg against the knee of the lifted one. Pull back on the lifted leg to stretch the bent one.",
    },
    {
      name: "pigeon pose",
      description:
        "Sit on the ground with one leg stuck back lying on the ground and the other leg bent obtuse and tucked into your torso. Sit back.",
    },
    {
      name: "cat camel",
      description:
        "Bent over with both knees and both hands on the ground, alternate between arching the back and pointing upwards (cat) and arching the back and pointing downwards (camel).",
    },
    {
      name: "recover",
    },
    {
      name: "high plank",
    },
    {
      name: "isometric bear crawl with shoulder taps",
    },
    {
      name: "oblique twists",
    },
    {
      name: "side plank",
    },
    {
      name: "resistance band tall kneeling pallof press",
    },
    {
      name: "barbell bench press",
    },
    {
      name: "single-arm dumbbell incline bench press",
    },
    {
      name: "dumbbell front raise",
    },
    {
      name: "tricep dips",
    },
    {
      name: "dumbbell goblet squats",
    },
    {
      name: "stability ball leg curls",
    },
    {
      name: "dumbbell split squats",
    },
    {
      name: "barbell romanian deadlift",
    },
  ],
  variants: [
    { name: "left side" },
    { name: "right side" },
    { name: "5 second tempo" },
    { name: "4 second tempo" },
  ],
  workout_defs: [
    {
      name: "upper-body push",
      description: "push push push",
      blocks: [
        {
          name: "stretch",
          description: "get stretched",
          sets: 1,
          transition_time: 5,
          exercises: [
            {
              description: "Get some real good flexion on this one yo",
              exercise: "lower back stretch",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "lower back stretch",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "crossbody lat stretch",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "crossbody lat stretch",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 30,
            },
          ],
        },
        {
          name: "core",
          sets: 2,
          exercises: [
            {
              exercise: "high plank",
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "isometric bear crawl with shoulder taps",
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 15,
            },
          ],
        },
        {
          name: "bench",
          sets: 3,
          exercises: [
            {
              exercise: "barbell bench press",
              variants: ["5 second tempo"],
              limit_type: "reps",
              limit_value: 8,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 60,
            },
          ],
        },
        {
          name: "accessory",
          sets: 3,
          exercises: [
            {
              exercise: "single-arm dumbbell incline bench press",
              variants: ["left side", "4 second tempo"],
              limit_type: "reps",
              limit_value: 8,
            },
            {
              exercise: "single-arm dumbbell incline bench press",
              variants: ["right side", "4 second tempo"],
              limit_type: "reps",
              limit_value: 8,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "dumbbell front raise",
              limit_type: "reps",
              limit_value: 8,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "tricep dips",
              limit_type: "reps",
              limit_value: 15,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 30,
            },
          ],
        },
      ],
    },
    {
      name: "lower-body",
      blocks: [
        {
          name: "stretch",
          sets: 1,
          transition_time: 5,
          exercises: [
            {
              exercise: "lateral hip openers",
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "airplanes",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "airplanes",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 30,
            },
          ],
        },
        {
          name: "core",
          sets: 2,
          exercises: [
            {
              exercise: "oblique twists",
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "side plank",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "side plank",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 15,
            },
          ],
        },
        {
          name: "squats",
          sets: 3,
          exercises: [
            {
              exercise: "dumbbell goblet squats",
              variant_name: "5 second tempo",
              limit_type: "reps",
              limit_value: 8,
            },
            {
              exercise: "stability ball leg curls",
              limit_type: "reps",
              limit_value: 8,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 30,
            },
          ],
        },
        {
          name: "accessory",
          sets: 3,
          exercises: [
            {
              exercise: "dumbbell split squats",
              variants: ["left side"],
              limit_type: "reps",
              limit_value: 8,
            },
            {
              exercise: "dumbbell split squats",
              variants: ["right side"],
              limit_type: "reps",
              limit_value: 8,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 45,
            },
            {
              exercise: "barbell romanian deadlift",
              limit_type: "reps",
              limit_value: 8,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 60,
            },
          ],
        },
      ],
    },
    {
      name: "daily stretch posterior",
      blocks: [
        {
          name: "part 1",
          sets: 1,
          transition_time: 5,
          exercises: [
            {
              exercise: "internal side stretch",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "internal side stretch",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "lower back stretch",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "lower back stretch",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "head to knee",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "head to knee",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "single leg knee tuck",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 15,
            },
            {
              exercise: "single leg knee tuck",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 15,
            },
            {
              exercise: "both legs knee tuck",
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "recover",
              limit_type: "time_s",
              limit_value: 15,
            },
          ],
        },
        {
          name: "part 2",
          sets: 1,
          transition_time: 5,
          exercises: [
            {
              exercise: "seated forward fold",
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "spiderman stretch",
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "equestrian",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 15,
            },
            {
              exercise: "equestrian",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 15,
            },
            {
              exercise: "figure-four stretch",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "figure-four stretch",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "pigeon pose",
              variants: ["left side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "pigeon pose",
              variants: ["right side"],
              limit_type: "time_s",
              limit_value: 30,
            },
            {
              exercise: "cat camel",
              limit_type: "time_s",
              limit_value: 30,
            },
          ],
        },
      ],
    },
  ],
  workout_cycles: [
    {
      name: "default",
      description: "Your weekday grind",
      entries: ["upper-body push", "lower-body"],
    },
    {
      name: "stretch",
      entries: ["daily stretch posterior"],
    },
  ],
};

console.log(JSON.stringify(ioData, null, 2));
