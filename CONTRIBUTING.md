# Contributing to Aegis - Sustainable Enviro

First off, thank you for considering contributing to Aegis! It's people like you that make Mission Swachh-City a reality. 

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](../../issues) page to see if someone else has already created a ticket. If not, go ahead and make one!

## Fork & Pull Request Workflow

1. **Fork the repository** on GitHub.
2. **Clone the project** to your own machine.
3. **Create a new branch** with a descriptive name:
   `git checkout -b feature/awesome-new-feature` or `git checkout -b bugfix/squash-that-bug`
4. **Make your changes** to the codebase.
5. **Commit your changes**:
   `git commit -m "Add some awesome new feature"`
6. **Push to your fork**:
   `git push origin feature/awesome-new-feature`
7. **Open a Pull Request** in this repository.

## Styleguides
* **CSS:** We use standard CSS variables for theming. Please ensure any new UI elements utilize the `--bg`, `--panel`, `--text`, and `--green` root variables to maintain Light/Dark mode compatibility.
* **JavaScript:** Keep it vanilla. We are avoiding heavy frameworks (React/Vue) for this specific iteration to maintain absolute simplicity. Ensure any state changes reflect correctly in `localStorage` via the `AegisDB` object.

Thank you for helping us build a greener future!
