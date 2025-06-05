# BuskerSolver

Run the script with a string of modifiers as the arg (ie busker-solver modifiers="Meat Drop, Familiar Weight" or busker-solver modifiers="Familiar Weight") and let busker solver find you a combo to maximize that thing!

You can add this script to your own mafia with:

`git checkout ignose/buskersolver release`

Arguments:

modifiers:
    help: Numeric Modifiers to check; these can be singular like modifiers="Meat Drop", multiple like modifiers="Meat Drop, Familiar Weight" or weighted like modifiers="5 Meat Drop, 10 Familiar Weight"
    default: "Meat Drop"

    
uselesseffects:
    help: Effects that aren't helpful for you, for instance uselesseffects="Leash of Linguini, Empathy, Thoughtful Empathy"
    default: ""


This script is a work in progress. Beware bugs!
