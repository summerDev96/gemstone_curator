// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StoneAvatar } from "./StoneAvatar";

afterEach(cleanup);

describe("StoneAvatar", () => {
  it("주얼리 대체 텍스트를 표시한다", () => {
    render(
      <StoneAvatar
        imageUrl="/images/jewelry/larimar.png"
        colorHex="#4FA8AE"
        alt="라리마"
      />,
    );

    expect(
      screen.getByRole("img", { name: "라리마 실버 펜던트 목걸이" }),
    ).toBeInTheDocument();
  });

  it("이미지 로딩 실패 시 색상 fallback으로 전환한다", () => {
    render(
      <StoneAvatar
        imageUrl="/images/jewelry/larimar.png"
        colorHex="#4FA8AE"
        alt="라리마"
      />,
    );

    fireEvent.error(screen.getByRole("img"));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("stone-color-fallback")).toHaveStyle({
      backgroundColor: "#4FA8AE",
    });
  });

  it("URL이 없으면 처음부터 색상 fallback만 표시한다", () => {
    render(<StoneAvatar imageUrl={null} colorHex="#4FA8AE" alt="라리마" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("stone-color-fallback")).toBeInTheDocument();
  });
});
