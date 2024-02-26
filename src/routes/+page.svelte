<script lang="ts">
    import RenderAgain from "./midinotes/+page.svelte";

    import { Midi } from '@tonejs/midi'
	import { onMount } from "svelte";
	import PianoRoll from '../components/PianoRoll.svelte';
    import Fretboard from "../components/Fretboard/Fretboard.svelte";
    type noteData = {
          midi: Number,               // midi number, e.g. 60
          time: Number,               // time in seconds
          ticks: Number,              // time in ticks
          name: String,               // note name, e.g. "C4",
          pitch: String,              // the pitch class, e.g. "C",
          octave : Number,            // the octave, e.g. 4
          velocity: Number,           // normalized 0-1 velocity
          duration: Number,           // duration in seconds between noteOn and noteOff
        };
   
 
</script>


