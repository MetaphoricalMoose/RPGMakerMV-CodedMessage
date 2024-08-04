# Coded Message plugin for RPG Maker MV

Welcome! 

This plugin is a humble first attempt at making an RPG Maker MV plugin, and adds a cypher feature to your project.

It is (heavily) inspired of the Al Bhed language/cypher from Final Fantasy X.

## Features

With Coded Message you will be able to add cyphered messages to your adventure, and decode them based on how much of the code the player knows. During the decoding process, the plugin keeps track of how much of the message was decoded and stores the percentage in a variable of your choosing, so you can add conditional branches based on how much the player theoretically understood.

Here is the player encountering a coded message:

![Coded message](/img/01_coded_message.jpg)

Without any knowledge of the cypher, the decoded message will be the same:

![Decoded message with 0% knowledge](/img/02_decoded_message_0_knowledge.jpg)

With the knowledge of half the code (in this case, from letters A to M), the message will look like this:

![Decoded message with 0% knowledge](/img/03_decoded_message_half_knowledge.jpg)

And finally, with the knowledge of the other half the code (from letters N to Z), the message will be fully decoded:

![Decoded message with 0% knowledge](/img/04_decoded_message_full_knowledge.jpg)

## Plugin parameters

The plugin has a few options you can tweak to fit your needs. A complete description is available in the plugin's help section.

**Source Variable**

*default: 1*

Select the variable that will contain the message to decode.

**Decode Rate**

*default: 2*

Select the variable where the decode rate will be stored after decoding.

**Output line length**

*default: 50*

While 50 characters per line seemed like a good default value for vanilla RPG Maker MV, you may need a different value because of your messages' style. You can adjust it here.

**Coded Text Color**

*default: 5*

The color of the unknown letters in the decoded message.

**Decoded Text Color**

*default: 0*

The color of the decoded letters in the decoded message.

**Decoded Message Position**

*default: Middle*

Select the placement of the decoded message between Top, Middle and Bottom.

**Decoded Message Background**

*default: Transparent*

Select the opacity of the decoded message between Opaque, Transparent and Invisible.

**Additional non-decode characters**

*default: , . ; ? ! ' ( ) -*

Some characters don't make sense to decode (like space and punctuation). By default the plugin won't attempt to decode (nor include in the decode rate) the following characters: `(space) , . ; ? ! ' ( ) -`. If you need to add more, you can add them to this parameter as a comma-separated list.

## Demo project

This repo includes a demo project to showcase how to set up and use the plugin.

## Terms of use

Free to use in your non-commercial projects, with credit to MetaphoricalMoose :)
Please don't use in commercial projects.

## Changlog

* Version: 1.0: Initial Release
* Version: 1.1: Added `( ) -` to the no-decode list