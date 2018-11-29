function time(d,...args) {
    if (!d)
        return Date.now();
    
    if (typeof d == "string")
        // Format: DD/MM/YYYY HH.mm
        args = [subint(d,6,4), subint(d,3,2)-1, subint(d,0,2), subint(d,11,2), subint(d,14,2)];
    else
        args.unshift(d);

    // args: 0:year, 1:monthIndex, 2:day, 3:hours, 4:minutes
    return new Date(args[0], args[1], args[2], args[3], args[4]).getTime();
}

time.unix = (...args) => {
    return ~~(time.apply(null, args) / 1000);
}

function subint(s, i, l) {
    return parseInt(s.substr(i, l));
}

export default time;