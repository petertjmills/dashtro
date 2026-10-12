{
  description = "Dashtro — declarative, code-first dashboards for Astro";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_22
            pkgs.pnpm
            pkgs.git
            pkgs.duckdb
            pkgs.postgresql_17 # for the opt-in Postgres integration tests
            pkgs.unzip # to unpack asset archives
          ];

          shellHook = ''
            echo "dashtro: node $(node --version), pnpm $(pnpm --version)"
          '';
        };

        formatter = pkgs.nixfmt;
      }
    );
}
