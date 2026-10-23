import { BackdropMain } from "./backdrop";
import { Loading } from "./loading";
import { Spinner, pageLoaderSpinner } from "./spinner";

export class LoadingMain extends Loading {
  constructor(
    protected backdrop: BackdropMain,
    protected spinner: Spinner,
  ) {
    super(backdrop, spinner);
  }

  getBackdrop(): BackdropMain {
    return this.backdrop;
  }
}

const instanceLoadingMain = () => new LoadingMain(new BackdropMain(), pageLoaderSpinner);

export const loadingMain: LoadingMain = instanceLoadingMain();