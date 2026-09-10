// Journey pack types. This EPIC uses only the subset needed to exercise the
// withhold-then-reveal loop; later EPICs load real packs through these types.

export interface Milepost {
  id: string;
  mileMark: number; // cumulative miles at which this milepost is reached
  place: string;
  approxNote: string;
  text: string; // the traveler's words, revealed only once reached
}

export interface JourneyPack {
  id: string;
  title: string;
  traveler: string;
  totalMiles: number;
  mileposts: Milepost[]; // ordered ascending by mileMark
}
