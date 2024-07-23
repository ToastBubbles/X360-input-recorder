const HID = require('node-hid');

// Find Xbox 360 controller
const devices = HID.devices();
const xbox360Devices = devices.filter(device =>
    device.vendorId === 1118 && device.productId === 654);

if (xbox360Devices.length === 0) {
    console.error('Xbox 360 controller not found.');
    process.exit(1);
}

const xbox360Device = new HID.HID(xbox360Devices[0].path);

console.log('Xbox 360 controller found. Waiting for input...');

const stickDeadzone = 0.1;
const triggerDeadzone = 0.1;

let controllerState = {
    A: null,
    B: null,
    X: null,
    Y: null,
    LB: null,
    RB: null,
    LT: null,
    RT: null,
    BB: null,
    Start: null,
    LS: null,
    RS: null,
    LSX: null,
    LSY: null,
    RSX: null,
    RSY: null,
    L: null,
    R: null,
    U: null,
    D: null,
    init: false
}


const comands = [];
let lastTimestamp = Date.now();

// Event listener for data
xbox360Device.on('data', data => {
    // Interpret data
    const [reportId, buttons1, buttons2, leftX, leftY, rightX, rightY, leftTrigger, rightTrigger] = data;
    const normalizeStick = value => (value - 128) / 128.0;
    const normalizeTrigger = value => value / 255.0;
    // Buttons1 bitmask interpretation
    const currentValues = {
        A: !!(buttons1 & 0x10),
        B: !!(buttons1 & 0x20),
        X: !!(buttons1 & 0x40),
        Y: !!(buttons1 & 0x80),
        LB: !!(buttons1 & 0x01),
        RB: !!(buttons1 & 0x02),
        LT: normalizeTrigger(leftTrigger).toFixed(2),
        RT: normalizeTrigger(rightTrigger).toFixed(2),
        BB: !!(buttons1 & 0x04),
        Start: !!(buttons1 & 0x08),
        LS: !!(buttons2 & 0x01),
        RS: !!(buttons2 & 0x02),
        LSX: normalizeStick(leftX).toFixed(2),
        LSY: normalizeStick(leftY).toFixed(2),
        RSX: normalizeStick(rightX).toFixed(2),
        RSY: normalizeStick(rightY).toFixed(2),
        L: !!(buttons2 & 0x40),
        R: !!(buttons2 & 0x80),
        U: !!(buttons2 & 0x10),
        D: !!(buttons2 & 0x20),

    }




    // const A_BUTTON = !!(buttons1 & 0x10);
    // const B_BUTTON = !!(buttons1 & 0x20);
    // const X_BUTTON = !!(buttons1 & 0x40);
    // const Y_BUTTON = !!(buttons1 & 0x80);
    // const LEFT_BUMPER = !!(buttons1 & 0x01);
    // const RIGHT_BUMPER = !!(buttons1 & 0x02);
    // const BACK_BUTTON = !!(buttons1 & 0x04);
    // const START_BUTTON = !!(buttons1 & 0x08);

    // Buttons2 bitmask interpretation
    // const LEFT_STICK_CLICK = !!(buttons2 & 0x01);
    // const RIGHT_STICK_CLICK = !!(buttons2 & 0x02);
    // const XBOX_BUTTON = !!(buttons2 & 0x04);
    // const UP_BUTTON = !!(buttons2 & 0x10);
    // const DOWN_BUTTON = !!(buttons2 & 0x20);
    // const LEFT_BUTTON = !!(buttons2 & 0x40);
    // const RIGHT_BUTTON = !!(buttons2 & 0x80);

    // Analog stick values (normalized to [-1, 1])
    // const normalizeStick = value => (value - 128) / 128.0;
    // const LEFT_STICK_X = normalizeStick(leftX).toFixed(2);
    // const LEFT_STICK_Y = normalizeStick(leftY).toFixed(2);
    // const RIGHT_STICK_X = normalizeStick(rightX).toFixed(2);
    // const RIGHT_STICK_Y = normalizeStick(rightY).toFixed(2);

    // Trigger values (normalized to [0, 1])
    // const normalizeTrigger = value => value / 255.0;
    // const LEFT_TRIGGER = normalizeTrigger(leftTrigger).toFixed(2);
    // const RIGHT_TRIGGER = normalizeTrigger(rightTrigger).toFixed(2);

    // if (!controllerState.init) {
    //     //sets initial values
    //     controllerState = {
    //         A: currentValues.A,
    //         B: currentValues.B,
    //         X: currentValues.X,
    //         Y: currentValues.Y,
    //         LB: currentValues.LB,
    //         RB: currentValues.RB,
    //         LT: currentValues.LT,
    //         RT: currentValues.RT,
    //         BB: currentValues.BB,
    //         Start: currentValues.Start,
    //         LS: currentValues.LS,
    //         RS: currentValues.RS,
    //         LSX: currentValues.LSX,
    //         LSY: currentValues.LSY,
    //         RSX: currentValues.RSX,
    //         RSY: currentValues.RSY,
    //         L: currentValues.L,
    //         R: currentValues.R,
    //         U: currentValues.U,
    //         D: currentValues.D,
    //         init: true
    //     }
    // }



    ///Change these to your liking
    const settings = {
        initiateRecording: LEFT_BUMPER,
        stopRecording: RIGHT_BUMPER,
        leftStickDeadzone: stickDeadzone,
        rightStickDeadzone: stickDeadzone,
        leftTriggerDeadzone: triggerDeadzone,
        rightTriggerDeadzone: triggerDeadzone
    }


    const buttonNames = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'BB', 'Start', 'LS', 'RS', 'LSX', 'LSY', 'RSX', 'RSY', 'L', 'R', 'U', 'D'];

    if (!controllerState.init) {
        // Initialize controller state
        controllerState = { ...currentValues, init: true };
    } else {
        const currentTime = Date.now();
        const timeDelta = currentTime - lastTimestamp;

        buttonNames.forEach(button => {
            if (currentValues[button] !== controllerState[button]) {
                commands.push(`wait(${timeDelta});`);
                const value = currentValues[button];
                const buttonValue = value === true ? 100 : (value === false ? 0 : value);
                commands.push(`setVal(BUTTON_${button}, ${buttonValue});`);
                lastTimestamp = currentTime;
            }
        });

        // Update controller state
        controllerState = { ...currentValues, init: true };
    }


});

// Event listener for error
xbox360Device.on('error', error => {
    console.error('Error:', error);
});

// Keep the program running
process.stdin.resume();