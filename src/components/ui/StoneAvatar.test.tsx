// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StoneAvatar } from "./StoneAvatar";

afterEach(cleanup);

describe("StoneAvatar", () => {
  it("주얼리 대체 텍스트와 생성 이미지 안내를 표시한다", () => {
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
    expect(
      screen.getByText(
        "AI로 생성한 주얼리 예시 이미지이며 실제 판매 상품이 아니에요.",
      ),
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
    expect(
      screen.queryByText(
        "AI로 생성한 주얼리 예시 이미지이며 실제 판매 상품이 아니에요.",
      ),
    ).not.toBeInTheDocument();
  });

  it("URL이 없으면 처음부터 색상 fallback만 표시한다", () => {
    render(<StoneAvatar imageUrl={null} colorHex="#4FA8AE" alt="라리마" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("stone-color-fallback")).toBeInTheDocument();
  });
});
